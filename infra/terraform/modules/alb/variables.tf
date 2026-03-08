variable "project_name" {
  description = "Project name"
  type        = string
}

variable "env" {
  description = "Environment (dev/prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the ALB"
  type        = list(string)
}

variable "alb_security_group_ids" {
  description = "Security group IDs for the ALB"
  type        = list(string)
}

variable "health_check_path" {
  description = "Health check path for the target group"
  type        = string
  default     = "/v1/health"
}

variable "api_container_port" {
  description = "Port the API container listens on"
  type        = number
  default     = 3000
}

variable "idle_timeout" {
  description = "ALB idle timeout in seconds (120-300 recommended for WebSocket)"
  type        = number
  default     = 120
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listener (empty string to skip HTTPS)"
  type        = string
  default     = ""
}
