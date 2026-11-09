package lld_logger_framework

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// Level goes from lowest to highest, so a record passes when its level >= the logger's level.
type Level int

const (
	Debug Level = iota
	Info
	Warn
	Error
)

func (l Level) String() string { return [...]string{"DEBUG", "INFO", "WARN", "ERROR"}[l] }

// Record is what one log call produced. Time comes from the injected clock, never from time.Now() here.
type Record struct {
	Level Level
	Msg   string
	Time  int
}

// Formatter turns a record into one line of text.
type Formatter interface{ Format(r Record) string }

type ShortFormat struct{}

func (ShortFormat) Format(r Record) string { return r.Level.String() + ": " + r.Msg }

type FullFormat struct{}

func (FullFormat) Format(r Record) string {
	return "[" + strconv.Itoa(r.Time) + "] " + r.Level.String() + " " + r.Msg
}

// Appender is where a line goes. Write returns an error when the destination fails.
type Appender interface {
	Name() string
	Write(r Record) error
}

// ConsoleAppender prints through Out, which is fmt.Println unless a test swaps it.
type ConsoleAppender struct {
	Fmt Formatter
	Out func(line string)
}

func (ConsoleAppender) Name() string { return "console" }

func (a ConsoleAppender) Write(r Record) error {
	if a.Out == nil {
		fmt.Println(a.Fmt.Format(r))
		return nil
	}
	a.Out(a.Fmt.Format(r))
	return nil
}

type MemoryAppender struct {
	Fmt   Formatter
	Lines []string
}

func (*MemoryAppender) Name() string { return "memory" }

func (a *MemoryAppender) Write(r Record) error {
	a.Lines = append(a.Lines, a.Fmt.Format(r))
	return nil
}

// FileAppender is a file stand-in: it starts a new file once the current one holds MaxLines.
type FileAppender struct {
	Fmt      Formatter
	MaxLines int
	Files    [][]string
}

func NewFileAppender(f Formatter, maxLines int) *FileAppender {
	return &FileAppender{Fmt: f, MaxLines: maxLines, Files: [][]string{{}}}
}

func (*FileAppender) Name() string { return "file" }

func (a *FileAppender) Write(r Record) error {
	if len(a.Files[len(a.Files)-1]) >= a.MaxLines {
		a.Files = append(a.Files, []string{})
	}
	last := len(a.Files) - 1
	a.Files[last] = append(a.Files[last], a.Fmt.Format(r))
	return nil
}

// BrokenAppender is a destination that is always down, for tests.
type BrokenAppender struct{}

func (BrokenAppender) Name() string       { return "broken" }
func (BrokenAppender) Write(Record) error { return errors.New("destination is down") }

// Filter is one link in the chain. Returning false stops the record: nothing after it runs.
type Filter interface{ Allow(r Record) bool }

type DropContaining struct{ Word string }

func (f DropContaining) Allow(r Record) bool { return !strings.Contains(r.Msg, f.Word) }

type Logger struct {
	Level    Level    // [1] the logger owns a level, a filter chain and a list of appenders; all can change later
	Failures []string // the name of every appender whose Write failed
	clock    func() int
	apps     []Appender
	filters  []Filter
}

func NewLogger(level Level, clock func() int, apps []Appender) *Logger {
	return &Logger{Level: level, clock: clock, apps: apps}
}

func (l *Logger) AddFilter(f Filter) { l.filters = append(l.filters, f) }

// Log returns how many appenders took the record. 0 means it was dropped or every appender failed.
func (l *Logger) Log(level Level, msg string) int {
	if level < l.Level { // [2] below the current level: drop it before doing any work
		return 0
	}
	r := Record{Level: level, Msg: msg, Time: l.clock()}
	for _, f := range l.filters {
		if !f.Allow(r) { // [3] the filter chain runs in order and the first "no" ends it
			return 0
		}
	}
	written := 0
	for _, a := range l.apps {
		if err := a.Write(r); err != nil { // [4] every appender gets the record, in registration order, and formats it its own way
			l.Failures = append(l.Failures, a.Name()) // [5] one appender failing must not stop the others
			continue
		}
		written++
	}
	return written
}
