variable "project_name" {
  description = "Project name"
  type        = string
}

variable "env" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ElastiCache subnet group"
  type        = list(string)
}

variable "vpc_security_group_ids" {
  description = "Security group IDs to attach to the Redis cluster"
  type        = list(string)
}

variable "node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.micro"
}

variable "engine_version" {
  description = "Redis engine version"
  type        = string
  default     = "7.1"
}

variable "num_cache_nodes" {
  description = "Number of cache nodes (1 for single-node, >1 for cluster)"
  type        = number
  default     = 1
}

variable "parameter_group_family" {
  description = "Redis parameter group family"
  type        = string
  default     = "redis7"
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain automatic snapshots (0 = disabled)"
  type        = number
  default     = 0
}
