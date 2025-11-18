resource "aws_lb" "alb" {
#   name               = local.alb_name
  internal           = false
  load_balancer_type = "application"
  subnets            = aws_subnet.public[*].id
  security_groups    = [aws_security_group.alb.id]
}

resource "aws_lb_target_group" "tg" {
#   name     = "${local.name_prefix}-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.this.id
#   health_check { path = "/health"; matcher = "200-399"; interval = 30; timeout = 5 }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.alb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "forward"
    # forward { target_group { arn = aws_lb_target_group.tg.arn } }
  }
}
