terraform {
  required_version = ">= 1.4.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment and configure backend.tf to enable remote state
  # backend "s3" { ... }
}

provider "aws" {
  region = var.aws_region
  # Credentials via env: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
}
