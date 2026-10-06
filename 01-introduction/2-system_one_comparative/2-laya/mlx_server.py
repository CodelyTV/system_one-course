# /// script
# requires-python = ">=3.11"
# dependencies = ["laya-mlx==0.3.0", "fastapi", "uvicorn"]
# ///
import uvicorn
from fastapi import FastAPI, HTTPException
from laya_mlx import Router

router = Router(dtype="float16")
app = FastAPI()


@app.post("/v1/systemone")
async def systemone(request: dict):
    try:
        return router.predict(
            request["state"],
            request["questions"],
            model=request.get("model"),
            lang=request.get("lang"),
        )
    except (KeyError, ValueError) as error:
        raise HTTPException(status_code=400, detail=str(error))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=11500)
