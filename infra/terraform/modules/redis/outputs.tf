output "redis_cluster_id" {
  description = "ElastiCache cluster ID"
  value       = aws_elasticache_cluster.main.cluster_id
}

output "redis_endpoint" {
  description = "Redis primary endpoint address"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.main.port
}

output "redis_subnet_group_name" {
  description = "ElastiCache subnet group name"
  value       = aws_elasticache_subnet_group.main.name
}
