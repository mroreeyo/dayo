resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project_name}-${var.env}-redis-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.env}-redis-subnet-group"
  }
}

resource "aws_elasticache_parameter_group" "main" {
  name   = "${var.project_name}-${var.env}-redis-params"
  family = var.parameter_group_family

  tags = {
    Name = "${var.project_name}-${var.env}-redis-params"
  }
}

resource "aws_elasticache_cluster" "main" {
  cluster_id = "${var.project_name}-${var.env}-redis"

  engine               = "redis"
  engine_version       = var.engine_version
  node_type            = var.node_type
  num_cache_nodes      = var.num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = var.vpc_security_group_ids

  port = 6379

  snapshot_retention_limit = var.snapshot_retention_limit

  tags = {
    Name = "${var.project_name}-${var.env}-redis"
  }
}
