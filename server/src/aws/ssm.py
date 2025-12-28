# src/aws/ssm.py
import boto3
from functools import lru_cache


@lru_cache
def get_ssm_client():
    return boto3.client("ssm", region_name="ap-southeast-1")


@lru_cache
def get_ssm_parameter(name: str) -> str:
    response = get_ssm_client().get_parameter(Name=name, WithDecryption=True)
    print(f"RESPONSE IN GET SSM PARAMETER: {response}")
    return response["Parameter"]["Value"]
