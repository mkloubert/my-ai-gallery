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

package routes

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"slices"
	"sort"
	"strings"

	"github.com/gorilla/mux"
	"github.com/mkloubert/my-ai-gallery/types"
)

type getImageResponse struct {
	Images []getImageResponseImage `json:"images"`
}

type getImageResponseImage struct {
	Info *getImageResponseImageInfo `json:"info"`
	Name string                     `json:"name"`
	Url  string                     `json:"url"`
}

type getImageResponseImageInfo struct {
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
	Title       string   `json:"title"`
}

// CreateHandleGetImageHandler creates handler for `/api/images/{imagename}` route.
func CreateHandleGetImageHandler(app *types.AppContext) types.HttpHandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		imageFolder := app.GetImageFolder()

		vars := mux.Vars(r)
		imageName := vars["imagename"]

		fullPath := filepath.Join(imageFolder, imageName)

		file, err := os.Open(fullPath)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}
		defer file.Close()

		buf := make([]byte, 512)
		_, err = file.Read(buf)
		if err != nil && err.Error() != "EOF" {
			app.SendHttpError(err, w)
			return
		}

		mimeType := http.DetectContentType(buf)

		file.Seek(0, 0)

		w.Header().Set("Content-Type", mimeType)

		io.Copy(w, file)
	}
}

// CreateHandleGetImagesHandler creates handler for `/api/images` route.
func CreateHandleGetImagesHandler(app *types.AppContext) types.HttpHandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		imageFolder := app.GetImageFolder()

		files, err := os.ReadDir(imageFolder)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		db, err := app.OpenImageDatabase()
		if err != nil {
			app.SendHttpError(err, w)
			return
		}
		defer db.Close()

		newResponse := getImageResponse{}
		newResponse.Images = make([]getImageResponseImage, 0)

		for _, f := range files {
			filePath := f.Name()
			row := db.QueryRow("SELECT title, description, tags FROM images WHERE file_path = ?;", filePath)

			found := true

			var title, description, tags string
			err = row.Scan(&title, &description, &tags)
			if err != nil {
				found = false
			}

			func() {
				fullPath := filepath.Join(imageFolder, f.Name())

				file, err := os.Open(fullPath)
				if err != nil {
					return
				}
				defer file.Close()

				buf := make([]byte, 512)
				_, err = file.Read(buf)
				if err != nil && err.Error() != "EOF" {
					return
				}

				mimeType := http.DetectContentType(buf)
				if !strings.HasPrefix(mimeType, "image/") {
					return
				}

				newImage := getImageResponseImage{}
				newImage.Name = f.Name()
				newImage.Url = fmt.Sprintf("/api/images/%s", url.PathEscape(f.Name()))

				if found {
					tagList := make([]string, 0)

					parts := strings.Split(tags, ",")
					for _, p := range parts {
						p = strings.TrimSpace(strings.ToLower(p))
						if p == "" {
							continue
						}

						if !slices.Contains(tagList, p) {
							tagList = append(tagList, p)
						}
					}

					sort.Strings(tagList)

					newInfo := &getImageResponseImageInfo{
						Title:       strings.TrimSpace(title),
						Description: strings.TrimSpace(description),
						Tags:        tagList,
					}

					newImage.Info = newInfo
				}

				newResponse.Images = append(newResponse.Images, newImage)
			}()
		}

		jsonData, err := json.Marshal(&newResponse)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		w.Header().Set("Content-Type", "application/json; charset=UTF-8")
		w.Write(jsonData)
	}
}
