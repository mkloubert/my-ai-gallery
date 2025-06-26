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
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// GetImageFolder returns the full path of the image root folder.
func GetImageFolder() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return cwd, err
	}

	MAIG_IMAGES := strings.TrimSpace(os.Getenv("MAIG_IMAGES"))
	if MAIG_IMAGES == "" {
		MAIG_IMAGES = "./images"
	}

	if !filepath.IsAbs(MAIG_IMAGES) {
		MAIG_IMAGES = filepath.Join(cwd, MAIG_IMAGES)
	}

	return MAIG_IMAGES, nil
}

// SendHttpError sends an error as 500 HTTP response.
func SendHttpError(err error, w http.ResponseWriter) {
	w.WriteHeader(500)
	w.Header().Set("Content-Type", "text/plain; charset=UTF-8")

	w.Write([]byte(err.Error()))
}
