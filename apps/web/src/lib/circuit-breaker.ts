/**
 * Circuit Breaker Pattern Implementation
 *
 * Prevents cascading failures from external services (AI providers, APIs)
 * by monitoring error rates and temporarily stopping requests when threshold is reached.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Too many failures, requests are rejected immediately
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 *
 * Usage:
 * ```typescript
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   successThreshold: 2,
 *   timeout: 60000,
 * });
 *
 * const result = await breaker.execute(async () => {
 *   return await callAIProvider();
 * });
 * ```
 */

export type CircuitBreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  /**
   * Number of failures before opening circuit
   * @default 5
   */
  failureThreshold: number;

  /**
   * Number of successes needed in HALF_OPEN state to close circuit
   * @default 2
   */
  successThreshold: number;

  /**
   * Time in milliseconds before attempting recovery (transition to HALF_OPEN)
   * @default 60000 (1 minute)
   */
  timeout: number;

  /**
   * Optional callback when circuit state changes
   */
  onStateChange?: (state: CircuitBreakerState) => void;
}

/**
 * Circuit Breaker for managing external service failures
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private nextAttemptTime: number | null = null;

  private readonly options: Required<CircuitBreakerOptions>;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold ?? 5,
      successThreshold: options.successThreshold ?? 2,
      timeout: options.timeout ?? 60000,
      onStateChange: options.onStateChange ?? (() => {}),
    };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  /**
   * Execute function with circuit breaker protection
   * @throws Error if circuit is OPEN
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === "OPEN") {
      if (!this.nextAttemptTime || Date.now() < this.nextAttemptTime) {
        throw new Error(
          `Circuit breaker is OPEN. Retrying in ${Math.ceil((this.nextAttemptTime || 0) - Date.now())}ms`,
        );
      }
      // Attempt recovery
      this.setState("HALF_OPEN");
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Manually reset the circuit breaker to CLOSED state
   */
  reset(): void {
    this.setState("CLOSED");
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Handle successful request
   */
  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.reset();
      }
    }
  }

  /**
   * Handle failed request
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    // S1871: Consolidated duplicate branches - open circuit on threshold OR half-open failure
    const shouldOpen =
      this.failureCount >= this.options.failureThreshold ||
      this.state === "HALF_OPEN";

    if (shouldOpen) {
      this.setState("OPEN");
      // Schedule retry attempt
      this.nextAttemptTime = Date.now() + this.options.timeout;
    }
  }

  /**
   * Transition to new state
   */
  private setState(newState: CircuitBreakerState): void {
    if (newState !== this.state) {
      this.state = newState;
      this.successCount = 0;
      this.options.onStateChange(newState);
    }
  }
}

/**
 * Factory for creating named circuit breakers
 * Useful for managing multiple circuit breakers for different services
 */
export class CircuitBreakerFactory {
  private readonly breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(
    name: string,
    options?: Partial<CircuitBreakerOptions>,
  ): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(options));
    }
    const breaker = this.breakers.get(name);
    if (!breaker) {
      throw new Error(`Circuit breaker for ${name} not found after creation`);
    }
    return breaker;
  }

  /**
   * Reset a specific circuit breaker
   */
  reset(name: string): void {
    this.breakers.get(name)?.reset();
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  /**
   * Get metrics for all breakers
   */
  getAllMetrics(): Record<string, ReturnType<CircuitBreaker["getMetrics"]>> {
    const metrics: Record<
      string,
      ReturnType<CircuitBreaker["getMetrics"]>
    > = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }
}

/**
 * Global circuit breaker factory for AI providers
 */
export const aiProviderBreakers = new CircuitBreakerFactory();
