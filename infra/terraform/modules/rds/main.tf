resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.env}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.project_name}-${var.env}-db-subnet-group"
  }
}

resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-${var.env}-postgres"

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage > 0 ? var.max_allocated_storage : null
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  # Password managed via Secrets Manager or manual setup
  manage_master_user_password = true

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.vpc_security_group_ids

  multi_az            = var.multi_az
  publicly_accessible = false

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  deletion_protection = var.deletion_protection
  skip_final_snapshot = var.skip_final_snapshot
  final_snapshot_identifier = var.skip_final_snapshot ? null : "${var.project_name}-${var.env}-final-snapshot"

  performance_insights_enabled = var.performance_insights_enabled

  tags = {
    Name = "${var.project_name}-${var.env}-postgres"
  }
}
