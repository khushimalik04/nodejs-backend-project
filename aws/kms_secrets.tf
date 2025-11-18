resource "aws_kms_key" "secrets_key" {
#   description = "KMS key for ${local.name_prefix} secrets"
  deletion_window_in_days = 30
#   tags = { Name = "${local.name_prefix}-kms" }
}

resource "aws_secretsmanager_secret" "env" {
#   name   = "${local.name_prefix}-env"
  kms_key_id = aws_kms_key.secrets_key.key_id
  description = "Env secret for tasks-api (store DATABASE_URL, JWT_SECRET etc.)"
}

# Example secret value (never commit real secrets)
resource "aws_secretsmanager_secret_version" "env_values" {
  secret_id     = aws_secretsmanager_secret.env.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://<db_user>:<db_pass>@<host>:5432/<db_name>"
    JWT_SECRET_KEY = "<super_secret>"
    AWS_REGION = var.aws_region
  })
}
