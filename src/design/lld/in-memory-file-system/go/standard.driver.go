package lld_in_memory_file_system

// runOps replays operations the same way the TypeScript driver does. A failed call becomes "err: <message>".
func runOps(ops []string, args [][]any) []any {
	var fs *FileSystem
	var out []any
	for i, op := range ops {
		a := args[i]
		var res any
		var err error
		switch op {
		case "FileSystem":
			fs = NewFileSystem()
		case "mkdir":
			var made bool
			made, err = fs.Mkdir(a[0].(string))
			res = b2i(made)
		case "ls":
			res, err = fs.Ls(a[0].(string))
		case "addContentToFile":
			res, err = fs.AddContentToFile(a[0].(string), a[1].(string))
		case "readContent":
			res, err = fs.ReadContent(a[0].(string))
		case "delete":
			res, err = fs.Delete(a[0].(string))
		case "move":
			err = fs.Move(a[0].(string), a[1].(string))
			res = 1
		}
		if err != nil {
			res = "err: " + err.Error()
		}
		out = append(out, res)
	}
	return out
}

func b2i(b bool) int {
	if b {
		return 1
	}
	return 0
}
