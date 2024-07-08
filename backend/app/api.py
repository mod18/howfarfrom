from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from cloud_api_connector import CloudApiConnector

app = FastAPI()

origins = [
    "http://localhost:3000",
    "localhost:3000"
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/", tags=["root"])
async def root() -> dict:
    return {"message": "Hello World!"}

@app.get("/cloud_api/get_place/{query}")
async def get_place(query: str) -> str:
    q = CloudApiConnector()
    resp = q.get_place(query)
    return str(resp)