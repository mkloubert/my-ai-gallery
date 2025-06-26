// MIT License
//
// Copyright (c) 2025 Marcel Joachim Kloubert (https://marcel.coffee)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

package types

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

// AppContext stores information and provides features for handling
// the current application.
type AppContext struct {
	// EOL the char sequence for new lines.
	EOL string
	// Stderr is the standard error stream.
	Stderr *os.File
	// Stdout is the standard output stream.
	Stdout *os.File
	// WorkingDirectory stores the full path of the working directory.
	WorkingDirectory string
}

// GetImageFolder returns the full path of the image root folder.
func (app *AppContext) GetImageFolder() string {
	return filepath.Join(app.WorkingDirectory, "images")
}

// OpenImageDatabase open image SQL database.
func (app *AppContext) OpenImageDatabase() (*sql.DB, error) {
	imageFolder := app.GetImageFolder()
	databaseFile := filepath.Join(imageFolder, "images.db")

	return sql.Open("sqlite3", databaseFile)
}

// SendHttpError sends an error as 500 HTTP response.
func (app *AppContext) SendHttpError(err error, w http.ResponseWriter) {
	fmt.Fprintf(app.Stderr,
		"[HTTP ERROR]: %s%s",
		err.Error(), app.EOL,
	)

	w.WriteHeader(500)
	w.Header().Set("Content-Type", "text/plain; charset=UTF-8")

	w.Write([]byte(err.Error()))
}
