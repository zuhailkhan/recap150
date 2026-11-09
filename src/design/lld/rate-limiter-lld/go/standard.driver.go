package lld_rate_limiter_lld

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
func runOps(ops []string, args [][]any) []any {
	var rl *RateLimiter
	var out []any
	for i, op := range ops {
		a := args[i]
		switch op {
		case "RateLimiter":
			kind, p, q := a[0].(string), int(a[1].(float64)), int(a[2].(float64))
			var factory NewLimiter
			switch kind {
			case "token":
				factory = func() Limiter { return NewTokenBucket(p, q) }
			case "fixed":
				factory = func() Limiter { return NewFixedWindow(p, q) }
			default:
				factory = func() Limiter { return NewSlidingWindowLog(p, q) }
			}
			rl = NewRateLimiter(factory)
			out = append(out, nil)
		case "allow":
			if rl.Allow(a[0].(string), int(a[1].(float64))) {
				out = append(out, 1)
			} else {
				out = append(out, 0)
			}
		}
	}
	return out
}
