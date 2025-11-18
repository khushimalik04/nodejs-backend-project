resource "aws_vpc" "this" {
  cidr_block = var.vpc_cidr
#   tags = { Name = "${local.name_prefix}-vpc" }
}

resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.this.id
#   tags   = { Name = "${local.name_prefix}-igw" }
}

resource "aws_subnet" "public" {
  for_each            = toset(var.public_subnets)
  vpc_id              = aws_vpc.this.id
  cidr_block          = each.value
  map_public_ip_on_launch = true
  availability_zone   = data.aws_availability_zones.available.names[count.index]
#   tags = { Name = "${local.name_prefix}-public-${replace(each.value, ".", "-')}" }
}

resource "aws_subnet" "private" {
  for_each = toset(var.private_subnets)
  vpc_id   = aws_vpc.this.id
  cidr_block = each.value
#   tags = { Name = "${local.name_prefix}-private-${replace(each.value, ".", "-')}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }
#   tags = { Name = "${local.name_prefix}-public-rt" }
}

resource "aws_route_table_association" "public_assoc" {
  for_each = aws_subnet.public
  subnet_id = each.value.id
  route_table_id = aws_route_table.public.id
}

data "aws_availability_zones" "available" {}
