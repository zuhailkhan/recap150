package lld_logger_framework

// runOps replays operations the same way the TypeScript driver does. Numbers arrive from JSON as float64.
// Logger args: starting level, then appender specs [kind, format, optional max lines].
func runOps(ops []string, args [][]any) []any {
	var lg *Logger
	var now int
	var console []string
	var memory *MemoryAppender
	var file *FileAppender
	var out []any
	level := func(s string) Level {
		for l := Debug; l <= Error; l++ {
			if l.String() == s {
				return l
			}
		}
		panic("unknown level " + s)
	}
	for i, op := range ops {
		a := args[i]
		switch op {
		case "Logger":
			var apps []Appender
			for _, s := range a[1].([]any) {
				spec := s.([]any)
				var f Formatter = ShortFormat{}
				if spec[1].(string) == "full" {
					f = FullFormat{}
				}
				switch spec[0].(string) {
				case "console":
					apps = append(apps, ConsoleAppender{Fmt: f, Out: func(line string) { console = append(console, line) }})
				case "memory":
					memory = &MemoryAppender{Fmt: f}
					apps = append(apps, memory)
				case "file":
					file = NewFileAppender(f, int(spec[2].(float64)))
					apps = append(apps, file)
				case "broken":
					apps = append(apps, BrokenAppender{})
				}
			}
			lg = NewLogger(level(a[0].(string)), func() int { return now }, apps)
			out = append(out, nil)
		case "log":
			now = int(a[2].(float64))
			out = append(out, lg.Log(level(a[0].(string)), a[1].(string)))
		case "setLevel":
			out = append(out, lg.Level.String())
			lg.Level = level(a[0].(string))
		case "addFilter":
			lg.AddFilter(DropContaining{Word: a[0].(string)})
			out = append(out, 1)
		case "lines":
			lines := []string{}
			switch a[0].(string) {
			case "console":
				lines = append(lines, console...)
			case "memory":
				lines = append(lines, memory.Lines...)
			}
			out = append(out, lines)
		case "files":
			out = append(out, file.Files)
		case "failures":
			f := []string{}
			out = append(out, append(f, lg.Failures...))
		}
	}
	return out
}
