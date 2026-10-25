from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import logging
import mimetypes
import os
import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, FastAPI, File, Header, HTTPException, Response, UploadFile
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool
from starlette.middleware.cors import CORSMiddleware

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api_router = APIRouter(prefix="/api")
logger = logging.getLogger("blesstoart")

# ---------- Image storage ----------
APP_NAME = "bless-to-art"
LOCAL_UPLOADS_DIR = ROOT_DIR / "uploads"
IMAGE_STORAGE = os.environ.get("IMAGE_STORAGE", "local").strip().lower()
AWS_REGION = os.environ.get("AWS_REGION", "ap-south-1")
AWS_S3_BUCKET = os.environ.get("AWS_S3_BUCKET", "").strip()


def local_upload_path(storage_path: str) -> Path:
    """Resolve a stored relative path without allowing access outside uploads/."""
    root = LOCAL_UPLOADS_DIR.resolve()
    candidate = (root / storage_path).resolve()
    try:
        candidate.relative_to(root)
    except ValueError as exc:
        raise ValueError("Invalid upload path") from exc
    return candidate


def s3_client():
    if not AWS_S3_BUCKET:
        raise RuntimeError("AWS_S3_BUCKET must be set when IMAGE_STORAGE=s3")
    return boto3.client("s3", region_name=AWS_REGION)


def put_object(path: str, data: bytes, content_type: str) -> dict:
    if IMAGE_STORAGE == "s3":
        s3_client().put_object(
            Bucket=AWS_S3_BUCKET,
            Key=path,
            Body=data,
            ContentType=content_type,
            ServerSideEncryption="AES256",
        )
        return {"path": path, "size": len(data)}

    destination = local_upload_path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)
    return {"path": path, "size": len(data)}


def get_object(path: str):
    if IMAGE_STORAGE == "s3":
        try:
            result = s3_client().get_object(Bucket=AWS_S3_BUCKET, Key=path)
        except ClientError as exc:
            code = exc.response.get("Error", {}).get("Code", "")
            if code in {"404", "NoSuchKey", "NoSuchBucket"}:
                raise FileNotFoundError(path) from exc
            raise
        return result["Body"].read(), result.get("ContentType", "application/octet-stream")

    source = local_upload_path(path)
    return source.read_bytes(), mimetypes.guess_type(source.name)[0] or "application/octet-stream"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class SectionIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    description: str = ""
    display_order: int = 0
    is_active: bool = True


class ProductIn(BaseModel):
    section_id: str
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    price: float = Field(ge=0)
    image_url: str = ""
    is_available: bool = True
    stock_quantity: Optional[int] = Field(default=None, ge=0)
    is_featured: bool = False
    display_order: int = 0


# ---------- Simulated admin auth (prototype only — not production security) ----------
async def require_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization[7:]
    session = await db.admin_sessions.find_one({"token": token})
    if not session or session.get("expires_at", "") < now_iso():
        raise HTTPException(status_code=401, detail="Session expired or invalid")
    return token


@api_router.post("/admin/login")
async def admin_login(payload: dict):
    password = (payload or {}).get("password", "")
    expected = os.environ.get("ADMIN_PASSWORD", "")
    if not expected or not secrets.compare_digest(password, expected):
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = secrets.token_urlsafe(32)
    await db.admin_sessions.insert_one(
        {
            "token": token,
            "created_at": now_iso(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(hours=12)).isoformat(),
        }
    )
    return {"token": token, "mode": "simulated"}


@api_router.get("/admin/verify")
async def admin_verify(token: str = Depends(require_admin)):
    return {"ok": True}


@api_router.post("/admin/logout")
async def admin_logout(token: str = Depends(require_admin)):
    await db.admin_sessions.delete_one({"token": token})
    return {"ok": True}


# ---------- Sections ----------
async def with_count(doc):
    doc["product_count"] = await db.products.count_documents({"section_id": doc["id"]})
    return doc


@api_router.get("/sections")
async def list_sections():
    docs = await db.sections.find({"is_active": True}, {"_id": 0}).sort("display_order", 1).to_list(200)
    return [await with_count(d) for d in docs]


@api_router.get("/admin/sections")
async def list_sections_admin(token: str = Depends(require_admin)):
    docs = await db.sections.find({}, {"_id": 0}).sort("display_order", 1).to_list(500)
    return [await with_count(d) for d in docs]


async def section_name_taken(name: str, exclude_id: str = None):
    query = {"name": {"$regex": f"^{re.escape(name.strip())}$", "$options": "i"}}
    if exclude_id:
        query["id"] = {"$ne": exclude_id}
    return await db.sections.find_one(query) is not None


@api_router.post("/sections", status_code=201)
async def create_section(payload: SectionIn, token: str = Depends(require_admin)):
    if await section_name_taken(payload.name):
        raise HTTPException(status_code=409, detail="A section with this name already exists")
    doc = payload.model_dump()
    doc.update({"id": str(uuid.uuid4()), "name": payload.name.strip(), "created_at": now_iso(), "updated_at": now_iso()})
    await db.sections.insert_one(doc)
    doc.pop("_id", None)
    return await with_count(doc)


@api_router.put("/sections/{section_id}")
async def update_section(section_id: str, payload: SectionIn, token: str = Depends(require_admin)):
    existing = await db.sections.find_one({"id": section_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Section not found")
    if await section_name_taken(payload.name, exclude_id=section_id):
        raise HTTPException(status_code=409, detail="A section with this name already exists")
    updates = payload.model_dump()
    updates["name"] = payload.name.strip()
    updates["updated_at"] = now_iso()
    await db.sections.update_one({"id": section_id}, {"$set": updates})
    doc = await db.sections.find_one({"id": section_id}, {"_id": 0})
    return await with_count(doc)


@api_router.delete("/sections/{section_id}")
async def delete_section(
    section_id: str,
    mode: Optional[str] = None,
    target_section_id: Optional[str] = None,
    token: str = Depends(require_admin),
):
    existing = await db.sections.find_one({"id": section_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Section not found")
    count = await db.products.count_documents({"section_id": section_id})
    if count > 0:
        if mode == "move":
            if not target_section_id or target_section_id == section_id:
                raise HTTPException(status_code=400, detail="Choose a different destination section")
            target = await db.sections.find_one({"id": target_section_id})
            if not target:
                raise HTTPException(status_code=404, detail="Destination section not found")
            await db.products.update_many({"section_id": section_id}, {"$set": {"section_id": target_section_id, "updated_at": now_iso()}})
        elif mode == "delete_products":
            await db.products.delete_many({"section_id": section_id})
        else:
            raise HTTPException(status_code=409, detail=f"Section contains {count} product(s)", )
    await db.sections.delete_one({"id": section_id})
    return {"ok": True, "products_affected": count}


# ---------- Products ----------
@api_router.get("/products")
async def list_products(section_id: Optional[str] = None, featured: Optional[bool] = None, q: Optional[str] = None):
    query = {}
    if section_id:
        query["section_id"] = section_id
    if featured is not None:
        query["is_featured"] = featured
    if q:
        query["$or"] = [
            {"name": {"$regex": re.escape(q), "$options": "i"}},
            {"description": {"$regex": re.escape(q), "$options": "i"}},
        ]
    return await db.products.find(query, {"_id": 0}).sort([("display_order", 1), ("created_at", 1)]).to_list(1000)


@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    doc = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return doc


async def ensure_section(section_id: str):
    if not await db.sections.find_one({"id": section_id}):
        raise HTTPException(status_code=400, detail="Selected section does not exist")


@api_router.post("/products", status_code=201)
async def create_product(payload: ProductIn, token: str = Depends(require_admin)):
    await ensure_section(payload.section_id)
    doc = payload.model_dump()
    doc.update({"id": str(uuid.uuid4()), "name": payload.name.strip(), "created_at": now_iso(), "updated_at": now_iso()})
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, payload: ProductIn, token: str = Depends(require_admin)):
    if not await db.products.find_one({"id": product_id}):
        raise HTTPException(status_code=404, detail="Product not found")
    await ensure_section(payload.section_id)
    updates = payload.model_dump()
    updates["name"] = payload.name.strip()
    updates["updated_at"] = now_iso()
    await db.products.update_one({"id": product_id}, {"$set": updates})
    return await db.products.find_one({"id": product_id}, {"_id": 0})


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, token: str = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ---------- Editable site content ----------
DEFAULT_CONTENT = {
    "story_heading": "The joy of small things, made slowly.",
    "story_p1": "Bless to Art is a small creative studio celebrating handmade craft — the quiet pleasure of a candle lit at dusk, a keepsake carried every day, a print that makes a wall feel like home.",
    "story_p2": "Every piece is made in small batches with natural materials and thoughtful details, created to be gifted, kept, and loved for a long time.",
    "about_heading": "A small studio with a soft spot for little things.",
    "about_p1": "Bless to Art began with a simple belief: the objects we keep close should carry warmth. This is a creative studio page — the story here is a placeholder, ready for the owner's own words about how the brand began.",
    "about_p2": "What never changes is the making: slow, careful, and personal. Each piece is finished by hand and packed with care before it finds its way to you.",
}


@api_router.get("/content")
async def get_content():
    doc = await db.site_content.find_one({"id": "main"}, {"_id": 0})
    data = dict(DEFAULT_CONTENT)
    if doc:
        data.update({k: v for k, v in doc.get("values", {}).items() if k in DEFAULT_CONTENT})
    return data


@api_router.put("/admin/content")
async def update_content(payload: dict, token: str = Depends(require_admin)):
    values = {k: str(v) for k, v in (payload or {}).items() if k in DEFAULT_CONTENT}
    await db.site_content.update_one(
        {"id": "main"}, {"$set": {"values": values, "updated_at": now_iso()}}, upsert=True
    )
    return await get_content()


# ---------- Uploads ----------
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
IMAGE_EXTENSIONS = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024


@api_router.post("/uploads", status_code=201)
async def upload_image(file: UploadFile = File(...), token: str = Depends(require_admin)):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Use a JPG, PNG, WebP, or GIF image")
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail="Image must be under 8 MB")
    filename = file.filename or "upload"
    ext = IMAGE_EXTENSIONS[file.content_type]
    path = f"product-images/{APP_NAME}/{uuid.uuid4()}.{ext}"
    try:
        result = await run_in_threadpool(put_object, path, data, file.content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=502, detail="Upload failed. Please try again.")
    await db.uploads.insert_one(
        {
            "id": str(uuid.uuid4()),
            "storage_path": result["path"],
            "original_filename": filename,
            "content_type": file.content_type,
            "size": result.get("size", len(data)),
            "is_deleted": False,
            "created_at": now_iso(),
        }
    )
    return {"path": result["path"], "url": f"/api/files/{result['path']}"}


@api_router.get("/files/{path:path}")
async def serve_file(path: str):
    try:
        data, content_type = await run_in_threadpool(get_object, path)
    except (FileNotFoundError, ValueError):
        raise HTTPException(status_code=404, detail="File not found")
    return Response(content=data, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})


@api_router.get("/")
async def root():
    return {"message": "Bless to Art API"}


# ---------- Seed ----------
SEED_SECTIONS = [
    {"id": "sec-candles", "name": "Candles", "description": "Hand-poured soy candles in warm, calming scents.", "display_order": 1},
    {"id": "sec-keychains", "name": "Keychains", "description": "Pressed-flower resin keychains, made one at a time.", "display_order": 2},
    {"id": "sec-art-prints", "name": "Art Prints", "description": "Botanical and minimal line-art prints for quiet walls.", "display_order": 3},
    {"id": "sec-jewellery", "name": "Handmade Jewellery", "description": "Delicate handmade pieces with natural details.", "display_order": 4},
]

SEED_PRODUCTS = [
    {"section_id": "sec-candles", "name": "Vanilla Warmth Soy Candle", "price": 890, "is_featured": True, "stock_quantity": 14, "display_order": 1,
     "description": "Hand-poured soy candle with French vanilla, oakwood and warm cinnamon notes, in a reusable ceramic jar.",
     "image_url": "https://images.pexels.com/photos/6634662/pexels-photo-6634662.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"section_id": "sec-candles", "name": "Amber & Cedar Twilight Candle", "price": 950, "is_featured": True, "stock_quantity": 8, "display_order": 2,
     "description": "Soothing cedarwood, golden amber and a whisper of cardamom. Slow, even burn for quiet evenings.",
     "image_url": "https://images.unsplash.com/photo-1603905179139-db12ab535ca9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHwxfHxoYW5kbWFkZSUyMHNveSUyMGNhbmRsZSUyMGFlc3RoZXRpYyUyMG5hdHVyYWwlMjBsaWdodCUyMHN0dWRpb3xlbnwwfHx8fDE3OTI1MTkyNDJ8MA&ixlib=rb-4.1.0&q=85"},
    {"section_id": "sec-candles", "name": "French Lavender Meadow Candle", "price": 850, "is_featured": False, "stock_quantity": 20, "display_order": 3,
     "description": "Calming dried lavender buds nestled in soft soy wax — made for slow evenings and open windows.",
     "image_url": "https://images.unsplash.com/photo-1618324359017-5452b2f4eec9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHszfHxoYW5kbWFkZSUyMHNveSUyMGNhbmRsZSUyMGFlc3RoZXRpYyUyMG5hdHVyYWwlMjBsaWdodCUyMHN0dWRpb3xlbnwwfHx8fDE3OTI1MTkyNDJ8MA&ixlib=rb-4.1.0&q=85"},
    {"section_id": "sec-keychains", "name": "Pressed Daisy Resin Keychain", "price": 420, "is_featured": True, "stock_quantity": 25, "display_order": 1,
     "description": "A real wild daisy preserved in crystal-clear resin, finished with a brass keyring.",
     "image_url": "https://images.unsplash.com/photo-1725826474457-d4dc3d6d8abf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHxfHxoYW5kbWFkZSUyMHJlc2luJTIwa2V5Y2hhaW4lMjBqZXdlbHJ5JTIwYWVzdGhldGljJTIwY3JhZnR8ZW58MHx8fHwxNzkyNTE5MjQyfDA&ixlib=rb-4.1.0&q=85"},
    {"section_id": "sec-keychains", "name": "Ornate Floral Resin Tag", "price": 480, "is_featured": False, "stock_quantity": 18, "display_order": 2,
     "description": "Delicate dried-flower composite sealed in ultra-clear, UV-resistant resin.",
     "image_url": "https://images.unsplash.com/photo-1741980983723-09c2051e8b1e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzd8MHwxfHNlYXJjaHwzfHxoYW5kbWFkZSUyMHJlc2luJTIwa2V5Y2hhaW4lMjBqZXdlbHJ5JTIwYWVzdGhldGljJTIwY3JhZnR8ZW58MHx8fHwxNzkyNTE5MjQyfDA&ixlib=rb-4.1.0&q=85"},
    {"section_id": "sec-art-prints", "name": "Golden Leaf Botanical Print (A4)", "price": 650, "is_featured": True, "stock_quantity": 30, "display_order": 1,
     "description": "Fine-art print on 300gsm textured archival paper, featuring soft botanical shadows.",
     "image_url": "https://images.pexels.com/photos/1871809/pexels-photo-1871809.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"section_id": "sec-art-prints", "name": "Continuous Line Art Gallery Print", "price": 750, "is_featured": False, "stock_quantity": 15, "display_order": 2,
     "description": "Modern continuous-line portrait print with a museum-grade matte finish.",
     "image_url": "https://images.pexels.com/photos/11774231/pexels-photo-11774231.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
    {"section_id": "sec-jewellery", "name": "Sunburst Resin Floral Pendant", "price": 1150, "is_featured": True, "stock_quantity": 6, "display_order": 1,
     "description": "Artisanal resin pendant holding natural golden petals, on a gold-plated chain.",
     "image_url": "https://images.pexels.com/photos/17225166/pexels-photo-17225166.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"},
]


async def seed_catalogue():
    if await db.sections.count_documents({}) > 0:
        return
    ts = now_iso()
    for s in SEED_SECTIONS:
        await db.sections.insert_one({**s, "is_active": True, "created_at": ts, "updated_at": ts})
    for p in SEED_PRODUCTS:
        await db.products.insert_one(
            {**p, "id": str(uuid.uuid4()), "is_available": True, "created_at": ts, "updated_at": ts}
        )
    logger.info("Seeded catalogue: %d sections, %d products", len(SEED_SECTIONS), len(SEED_PRODUCTS))


@app.on_event("startup")
async def startup():
    if IMAGE_STORAGE == "local":
        LOCAL_UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        logger.info("Local upload storage initialised at %s", LOCAL_UPLOADS_DIR)
    elif IMAGE_STORAGE == "s3":
        if not AWS_S3_BUCKET:
            raise RuntimeError("AWS_S3_BUCKET must be set when IMAGE_STORAGE=s3")
        logger.info("S3 image storage initialised for bucket %s in %s", AWS_S3_BUCKET, AWS_REGION)
    else:
        raise RuntimeError("IMAGE_STORAGE must be either 'local' or 's3'")
    await seed_catalogue()


app.include_router(api_router)

DEFAULT_CORS_ORIGINS = ",".join(
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ]
)
cors_origins = [
    origin.strip()
    for origin in os.environ.get("CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
