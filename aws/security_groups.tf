# ALB SG
resource "aws_security_group" "alb" {
#   name   = "${local.name_prefix}-alb-sg"
  vpc_id = aws_vpc.this.id
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
#   egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

# ECS tasks SG (allow from ALB)
resource "aws_security_group" "ecs" {
#   name   = "${local.name_prefix}-ecs-sg"
  vpc_id = aws_vpc.this.id
  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
#   egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

# RDS SG
resource "aws_security_group" "rds" {
#   name   = "${local.name_prefix}-rds-sg"
  vpc_id = aws_vpc.this.id
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [aws_security_group.ecs.id] # allow ECS tasks to connect
  }
#   egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}

# Redis SG
resource "aws_security_group" "redis" {
#   name   = "${local.name_prefix}-redis-sg"
  vpc_id = aws_vpc.this.id
  ingress {
    from_port = 6379
    to_port   = 6379
    protocol  = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
#   egress { from_port = 0; to_port = 0; protocol = "-1"; cidr_blocks = ["0.0.0.0/0"] }
}
