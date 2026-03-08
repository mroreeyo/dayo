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

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.env}-alb-sg"
  description = "Allow HTTP/HTTPS inbound to ALB"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.env}-alb-sg"
  }
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${var.project_name}-${var.env}-ecs-tasks-sg"
  description = "Allow inbound from ALB and outbound to RDS/Redis"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = var.api_container_port
    to_port         = var.api_container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-${var.env}-ecs-tasks-sg"
  }
}

module "alb" {
  source = "../../modules/alb"

  project_name           = var.project_name
  env                    = var.env
  vpc_id                 = module.vpc.vpc_id
  public_subnet_ids      = module.vpc.public_subnet_ids
  alb_security_group_ids = [aws_security_group.alb.id]
  api_container_port     = var.api_container_port
  idle_timeout           = 120
  certificate_arn        = var.certificate_arn
}

module "ecs" {
  source = "../../modules/ecs"

  project_name           = var.project_name
  env                    = var.env
  private_subnet_ids     = module.vpc.private_subnet_ids
  ecs_security_group_ids = [aws_security_group.ecs_tasks.id]
  task_execution_role_arn = module.iam.ecs_task_execution_role_arn
  task_role_arn          = module.iam.ecs_task_role_arn

  api_image           = var.api_image
  api_container_port  = var.api_container_port
  api_task_cpu        = var.api_task_cpu
  api_task_memory     = var.api_task_memory
  api_desired_count   = var.api_desired_count
  api_target_group_arn = module.alb.api_target_group_arn

  worker_image         = var.worker_image
  worker_task_cpu      = var.worker_task_cpu
  worker_task_memory   = var.worker_task_memory
  worker_desired_count = var.worker_desired_count

  api_autoscaling_max    = 2
  worker_autoscaling_max = 2
}
