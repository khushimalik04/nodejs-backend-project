# OPTIONAL: Remote state with S3 + DynamoDB lock
terraform {
  backend "s3" {
    bucket         = var.tfstate_bucket
    key            = "${var.project_name}/terraform.tfstate"
    region         = var.aws_region
    dynamodb_table = var.tfstate_lock_table
    encrypt        = true
  }
}
