terraform {
  required_version = ">= 1.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration (Placeholder - usually S3/DynamoDB)
  # backend "s3" { ... }
}

provider "aws" {
  region = "ap-northeast-2"
}

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  env          = var.env
  vpc_cidr     = var.vpc_cidr
}

module "iam" {
  source = "../../modules/iam"

  project_name = var.project_name
  env          = var.env
}

resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.env}-rds-sg"
  description = "Allow Postgres from private subnets"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.env}-rds-sg"
  }
}

resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.env}-redis-sg"
  description = "Allow Redis from private subnets"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.env}-redis-sg"
  }
}

module "rds" {
  source = "../../modules/rds"

  project_name           = var.project_name
  env                    = var.env
  private_subnet_ids     = module.vpc.private_subnet_ids
  vpc_security_group_ids = [aws_security_group.rds.id]
  instance_class         = var.db_instance_class
  multi_az               = false
  deletion_protection    = false
  skip_final_snapshot    = true
}

module "redis" {
  source = "../../modules/redis"

  project_name           = var.project_name
  env                    = var.env
  private_subnet_ids     = module.vpc.private_subnet_ids
  vpc_security_group_ids = [aws_security_group.redis.id]
  node_type              = var.redis_node_type
}

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  env          = var.env
  force_destroy = true
}
