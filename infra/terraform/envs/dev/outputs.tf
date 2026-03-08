output "vpc_id" {
  value = module.vpc.vpc_id
}

output "public_subnet_ids" {
  value = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  value = module.vpc.private_subnet_ids
}

output "ecs_task_execution_role_arn" {
  value = module.iam.ecs_task_execution_role_arn
}

output "ecs_task_role_arn" {
  value = module.iam.ecs_task_role_arn
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "rds_db_name" {
  value = module.rds.db_name
}

output "redis_endpoint" {
  value = module.redis.redis_endpoint
}

output "redis_port" {
  value = module.redis.redis_port
}

output "s3_bucket_id" {
  value = module.s3.bucket_id
}

output "s3_bucket_arn" {
  value = module.s3.bucket_arn
}
