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

package main

import (
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/mkloubert/my-ai-gallery/routes"
	"github.com/mkloubert/my-ai-gallery/types"
)

func main() {
	cwd, err := os.Getwd()
	if err != nil {
		panic(err)
	}

	app := &types.AppContext{
		EOL:              fmt.Sprintln(),
		Stderr:           os.Stderr,
		Stdout:           os.Stdout,
		WorkingDirectory: cwd,
	}

	r := mux.NewRouter()
	r.HandleFunc("/api/images", routes.CreateGetImagesHandler(app)).Methods("GET")
	r.HandleFunc("/api/images/{imagename}", routes.CreateGetImageHandler(app)).Methods("GET")
	r.HandleFunc("/api/images/{imagename}/meta", routes.CreateUpdateImageMetaHandler(app)).Methods("PATCH")

	http.ListenAndServe(":8080", r)
}
