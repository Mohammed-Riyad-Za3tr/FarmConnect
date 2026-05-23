// ─── User Roles ────────────────────────────────────────────────────────────────

export enum UserRole {
  PRODUCER = 'PRODUCER',
  BUYER = 'BUYER',
  ADMIN = 'ADMIN',
}

export enum BuyerBusinessType {
  INDIVIDUAL = 'INDIVIDUAL',
  RESTAURANT = 'RESTAURANT',
  HOTEL = 'HOTEL',
  WHOLESALE = 'WHOLESALE',
  RETAIL = 'RETAIL',
  OTHER = 'OTHER',
}

// ─── User Status ───────────────────────────────────────────────────────────────

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  DELETED = 'DELETED',
}

// ─── Producer Verification Status ─────────────────────────────────────────────

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// ─── Product Status ────────────────────────────────────────────────────────────

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  ARCHIVED = 'ARCHIVED',
}

// ─── Order Status ──────────────────────────────────────────────────────────────

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// ─── Payment Status ────────────────────────────────────────────────────────────

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

// ─── Delivery Status ───────────────────────────────────────────────────────────

export enum DeliveryStatus {
  NOT_SHIPPED = 'NOT_SHIPPED',
  PREPARING = 'PREPARING',
  IN_TRANSIT = 'IN_TRANSIT',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  RETURNED = 'RETURNED',
}

// ─── Notification Type ─────────────────────────────────────────────────────────

export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_CONFIRMED = 'ORDER_CONFIRMED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PRODUCT_LOW_STOCK = 'PRODUCT_LOW_STOCK',
  PRODUCER_VERIFIED = 'PRODUCER_VERIFIED',
  PRODUCER_REJECTED = 'PRODUCER_REJECTED',
  GENERAL = 'GENERAL',
}

// ─── Payout Status ────────────────────────────────────────────────────────────

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
}
