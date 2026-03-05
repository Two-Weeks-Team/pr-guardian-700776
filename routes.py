import uuid
from fastapi import APIRouter, HTTPException
from models import (
    AnalyzePRRequest,
    AnalyzePRResponse,
    RankSuggestionsRequest,
    RankSuggestionsResponse,
)
from ai_service import do_chat_completion, AIServiceError

router = APIRouter()


@router.post("/api/v1/ai/pr-review/generate", response_model=AnalyzePRResponse)
async def generate_pr_review(payload: AnalyzePRRequest):
    system_prompt = (
        "You are PR Guardian. Analyze pull request diffs and static signals. "
        "Return strict JSON with key 'suggestions' only. "
        "Each suggestion must include severity, category, title, path, start_line, end_line, "
        "explanation, patch, confidence (0-1), and evidence array. "
        "Prioritize bug, security, and performance issues and limit to requested max_suggestions."
    )

    user_payload = payload.model_dump()

    try:
        ai_resp = await do_chat_completion(system_prompt=system_prompt, user_payload=user_payload)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    result = ai_resp["result"]
    suggestions = result.get("suggestions", [])

    return AnalyzePRResponse(
        review_id=f"rv_{uuid.uuid4().hex[:12]}",
        owner=payload.owner,
        repo=payload.repo,
        pr_number=payload.pr_number,
        suggestions=suggestions,
        model_usage={
            "provider": "digitalocean_serverless_inference",
            "model": ai_resp.get("model"),
            "usage": ai_resp.get("usage", {}),
        },
    )


@router.post("/api/v1/ai/suggestions/rank", response_model=RankSuggestionsResponse)
async def rank_suggestions(payload: RankSuggestionsRequest):
    system_prompt = (
        "You are PR Guardian ranking engine. Rank candidate suggestions for a repository based on "
        "likely impact and typical engineering team preferences. Return strict JSON with keys: "
        "ranked (array of {suggestion_id, rank, score, reason}) and policy (object)."
    )

    user_payload = payload.model_dump()

    try:
        ai_resp = await do_chat_completion(system_prompt=system_prompt, user_payload=user_payload, temperature=0.0)
    except AIServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc))

    result = ai_resp["result"]
    return RankSuggestionsResponse(
        ranked=result.get("ranked", []),
        policy=result.get("policy", {"learned_from_feedback": False, "suppressed": []}),
    )
