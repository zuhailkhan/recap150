package lld_in_memory_file_system

import (
	"errors"
	"slices"
	"strings"
)

var (
	ErrInvalid  = errors.New("invalid path")
	ErrNotFound = errors.New("not found")
	ErrNotDir   = errors.New("not a directory")
	ErrIsDir    = errors.New("is a directory")
	ErrExists   = errors.New("already exists")
	ErrInto     = errors.New("cannot move into itself")
)

// FsNode is the Composite: a file and a directory answer the same questions,
// so the caller never asks which one it holds.
type FsNode interface {
	Name() string
	SetName(string)
	Count() int                          // nodes in this subtree, itself included
	Find(parts []string) (FsNode, error) // follow the path segments down from here
}

type File struct {
	name    string
	Content string
}

func (f *File) Name() string     { return f.name }
func (f *File) SetName(n string) { f.name = n }
func (f *File) Count() int       { return 1 }

func (f *File) Find(parts []string) (FsNode, error) {
	if len(parts) > 0 {
		return nil, ErrNotDir // nothing lives below a file
	}
	return f, nil
}

type Dir struct {
	name     string
	children map[string]FsNode
}

func NewDir(name string) *Dir { return &Dir{name: name, children: map[string]FsNode{}} }

func (d *Dir) Name() string     { return d.name }
func (d *Dir) SetName(n string) { d.name = n }

func (d *Dir) Count() int {
	n := 1
	for _, c := range d.children {
		n += c.Count()
	}
	return n
}

func (d *Dir) Find(parts []string) (FsNode, error) {
	if len(parts) == 0 {
		return d, nil
	}
	child, ok := d.children[parts[0]]
	if !ok {
		return nil, ErrNotFound
	}
	return child.Find(parts[1:]) // [2] each level hands the rest of the path to the next node
}

// Mkdir creates every missing directory on the way. It reports whether it created anything.
func (d *Dir) Mkdir(parts []string) (bool, error) {
	if len(parts) == 0 {
		return false, nil
	}
	created := false
	child, ok := d.children[parts[0]]
	if !ok {
		child = NewDir(parts[0])
		d.children[parts[0]] = child // [3] a missing level is created, parents first
		created = true
	}
	sub, isDir := child.(*Dir)
	if !isDir {
		return false, ErrNotDir
	}
	more, err := sub.Mkdir(parts[1:])
	return more || created, err
}

// Parse treats "/a//b/" and "/a/b" as the same place. Only absolute paths are allowed,
// and "." and ".." are refused.
func Parse(path string) ([]string, error) {
	if !strings.HasPrefix(path, "/") {
		return nil, ErrInvalid
	}
	parts := []string{}
	for _, p := range strings.Split(path, "/") { // [1] drop empty segments: root is []
		if p != "" {
			parts = append(parts, p)
		}
	}
	if slices.Contains(parts, ".") || slices.Contains(parts, "..") {
		return nil, ErrInvalid
	}
	return parts, nil
}

type FileSystem struct{ root *Dir }

func NewFileSystem() *FileSystem { return &FileSystem{root: NewDir("")} }

func (fs *FileSystem) Mkdir(path string) (bool, error) {
	parts, err := Parse(path)
	if err != nil {
		return false, err
	}
	return fs.root.Mkdir(parts)
}

// Ls lists a directory's children, sorted. A file lists just itself.
func (fs *FileSystem) Ls(path string) ([]string, error) {
	parts, err := Parse(path)
	if err != nil {
		return nil, err
	}
	node, err := fs.root.Find(parts)
	if err != nil {
		return nil, err
	}
	dir, ok := node.(*Dir)
	if !ok {
		return []string{node.Name()}, nil
	}
	names := []string{}
	for name := range dir.children {
		names = append(names, name)
	}
	slices.Sort(names) // map order is random, so sort before anyone sees it
	return names, nil
}

// AddContentToFile appends to the file, creating it when missing. The parent directory must exist.
// It returns the new length.
func (fs *FileSystem) AddContentToFile(path, text string) (int, error) {
	dir, name, err := fs.parentOf(path)
	if err != nil {
		return 0, err
	}
	node, ok := dir.children[name]
	if !ok {
		node = &File{name: name}
		dir.children[name] = node
	}
	file, isFile := node.(*File)
	if !isFile {
		return 0, ErrIsDir
	}
	file.Content += text // [4] a file is the only node that holds text
	return len(file.Content), nil
}

func (fs *FileSystem) ReadContent(path string) (string, error) {
	parts, err := Parse(path)
	if err != nil {
		return "", err
	}
	node, err := fs.root.Find(parts)
	if err != nil {
		return "", err
	}
	file, ok := node.(*File)
	if !ok {
		return "", ErrIsDir
	}
	return file.Content, nil // [4]
}

// Delete removes a file, or a directory with everything under it. It returns how many nodes went.
func (fs *FileSystem) Delete(path string) (int, error) {
	dir, name, err := fs.parentOf(path)
	if err != nil {
		return 0, err
	}
	node, ok := dir.children[name]
	if !ok {
		return 0, ErrNotFound
	}
	delete(dir.children, name) // [5] detach from the parent, and the whole subtree goes with it
	return node.Count(), nil
}

// Move renames or moves a file or directory to a new full path that must not exist yet.
func (fs *FileSystem) Move(from, to string) error {
	src, err := Parse(from)
	if err != nil {
		return err
	}
	dst, err := Parse(to)
	if err != nil {
		return err
	}
	if len(dst) > len(src) && slices.Equal(src, dst[:len(src)]) {
		return ErrInto
	}
	srcDir, srcName, err := fs.parentOf(from)
	if err != nil {
		return err
	}
	node, ok := srcDir.children[srcName]
	if !ok {
		return ErrNotFound
	}
	dstDir, dstName, err := fs.parentOf(to)
	if err != nil {
		return err
	}
	if _, taken := dstDir.children[dstName]; taken {
		return ErrExists
	}
	delete(srcDir.children, srcName) // [5] detach here, attach there. The node and its subtree are not copied
	node.SetName(dstName)
	dstDir.children[dstName] = node
	return nil
}

// parentOf returns the directory that holds the last segment, and that segment. The root has no parent.
func (fs *FileSystem) parentOf(path string) (*Dir, string, error) {
	parts, err := Parse(path)
	if err != nil {
		return nil, "", err
	}
	if len(parts) == 0 {
		return nil, "", ErrInvalid
	}
	node, err := fs.root.Find(parts[:len(parts)-1])
	if err != nil {
		return nil, "", err
	}
	dir, ok := node.(*Dir)
	if !ok {
		return nil, "", ErrNotDir
	}
	return dir, parts[len(parts)-1], nil
}
