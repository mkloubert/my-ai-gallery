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
	"bytes"
	"encoding/base64"
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
	"time"

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

type imageDescriptionResponse struct {
	FileModifiationTime string                                   `json:"file_modifiation_time,omitempty"`
	Filename            string                                   `json:"filename,omitempty"`
	Filesize            int64                                    `json:"filesize,omitempty"`
	ImageInformation    imageDescriptionResponseImageInformation `json:"image_information,omitempty"`
}

type imageDescriptionResponseImageInformation struct {
	DetailedDescription string   `json:"detailed_description"`
	Tags                []string `json:"tags"`
	Title               string   `json:"title"`
}

// CreateHandleGetImageHandler creates handler for `/api/images/{imagename}` route.
func CreateGetImageHandler(app *types.AppContext) types.HttpHandlerFunc {
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
func CreateGetImagesHandler(app *types.AppContext) types.HttpHandlerFunc {
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

// CreateUpdateImageMetaHandler creates handler for `/api/images/{imagename}/meta` route.
func CreateUpdateImageMetaHandler(app *types.AppContext) types.HttpHandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		imageFolder := app.GetImageFolder()

		vars := mux.Vars(r)
		imageName := vars["imagename"]

		fullPath := filepath.Join(imageFolder, imageName)

		fmt.Printf("Patching meta of file '%s' ...%s", fullPath, fmt.Sprintln())

		info, err := os.Stat(fullPath)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		// get file size and last update time
		filesize := info.Size()
		fileModTime := info.ModTime().UTC().Format(time.RFC3339)

		fmt.Printf("Size of file '%s': %d%s", fullPath, filesize, fmt.Sprintln())
		fmt.Printf("Change date of file '%s': %s%s", fullPath, fileModTime, fmt.Sprintln())

		file, err := os.Open(fullPath)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}
		defer file.Close()

		imageData, err := io.ReadAll(file)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		mimeType := http.DetectContentType(imageData)
		base64ImageData := base64.StdEncoding.EncodeToString(imageData)

		fmt.Printf("Mime of file '%s': %s%s", fullPath, mimeType, fmt.Sprintln())

		defer func() {
			imageData = nil
		}()

		fmt.Printf("Opening database for file '%s' ...%s", fullPath, fmt.Sprintln())

		db, err := app.OpenImageDatabase()
		if err != nil {
			app.SendHttpError(err, w)
			return
		}
		defer db.Close()

		// lang := "english"

		/*
					systemPrompt := fmt.Sprintf(`You are an AI assistant that helps users organize their photo collections.
			For each provided image file, generate:
			- A concise and informative description of the image in natural '%s' language, suitable for someone who cannot see the photo.
			- A short and descriptive title of the main objects in the image.
			- A set of relevant tags that summarize the main objects, themes, activities, and visual elements present in the image. The tags should be lowercase, and without special characters.
			Be objective and accurate. Do not include personal opinions or assumptions that cannot be verified from the image itself.`, lang)
		*/

		responseSchema := &map[string]any{
			"type":     "object",
			"required": []string{"image_information", "tags", "title"},
			"properties": map[string]any{
				"image_information": map[string]any{
					"type":        "object",
					"description": "Information about the image.",
					"required":    []string{"detailed_description", "tags", "title"},
					"properties": map[string]any{
						"detailed_description": map[string]any{
							"description": "A detailed description what is in the image.",
							"type":        "string",
						},
						"tags": map[string]any{
							"type":    "array",
							"minimum": 1,
							"maximum": 10,
							"items": map[string]any{
								"type":        "string",
								"description": "Word or small text that categorized the image.",
							},
						},
						"title": map[string]any{
							"description": "A short and descriptive title for the image.",
							"type":        "string",
						},
					},
				},
			},
		}

		// responseSchemaName := "DescribeImageSchema"

		url := "http://host.docker.internal:11434/api/generate"
		prompt := "What is in this image?"
		temperature := 0.3

		model := strings.TrimSpace(os.Getenv("MAIG_IMAGE_MODEL"))
		if model == "" {
			model = "llama3.2-vision"
		}

		fmt.Printf("AI setting TEMPERATURE for file '%s': %f%s", fullPath, temperature, fmt.Sprintln())
		fmt.Printf("AI setting MODEL for file '%s': %s%s", fullPath, model, fmt.Sprintln())

		images := make([]string, 0)
		images = append(images, base64ImageData)

		body := map[string]any{
			"model":       model,
			"prompt":      prompt,
			"stream":      false,
			"temperature": temperature,
			"images":      images,
			"format":      responseSchema,
		}

		jsonData, err := json.Marshal(&body)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		fmt.Printf("POST to '%s' for file '%s' ...%s", url, fullPath, fmt.Sprintln())

		req, err := http.NewRequest("POST", url, bytes.NewBuffer([]byte(jsonData)))
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		// setup ...
		req.Header.Set("Content-Type", "application/json")
		// ... and finally send the JSON data
		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			var errToSend error

			responseData, err := io.ReadAll(resp.Body)
			if err == nil {
				errToSend = fmt.Errorf("request failed with status %d: %s", resp.StatusCode, string(responseData))
			} else {
				errToSend = fmt.Errorf("request failed with status %d and error reading response body", resp.StatusCode)
			}

			app.SendHttpError(errToSend, w)
			return
		}

		fmt.Printf("Loading response from '%s' for file '%s' ...%s", url, fullPath, fmt.Sprintln())

		// load the response
		responseData, err := io.ReadAll(resp.Body)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		fmt.Printf("Marshalling response from '%s' for file '%s' ...%s", url, fullPath, fmt.Sprintln())

		var completionResponse types.OllamaApiCompletionResponse
		err = json.Unmarshal(responseData, &completionResponse)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		answer := completionResponse.Response

		fmt.Printf("Marshalling final response from '%s' for file '%s' ...%s", url, fullPath, fmt.Sprintln())

		// ensure we have correct response ...
		var imageDescription imageDescriptionResponse
		err = json.Unmarshal([]byte(answer), &imageDescription)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		// update in database
		{
			fmt.Printf("Updating new data for file '%s' ...%s%s", url, fullPath, fmt.Sprintln())

			stmt, err := db.Prepare(`INSERT INTO images
(file_path, title, description, tags, last_filesize, last_modified) VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT(file_path) DO UPDATE SET
    description=excluded.description,
    tags=excluded.tags,
	title=excluded.title,
    last_filesize=excluded.last_filesize,
    last_modified=excluded.last_modified,
	updated_at=CURRENT_TIMESTAMP;`)
			if err != nil {
				app.SendHttpError(err, w)
				return
			}

			defer stmt.Close()

			_, err = stmt.Exec(
				imageDescription.Filename,
				imageDescription.ImageInformation.Title,
				imageDescription.ImageInformation.DetailedDescription,
				strings.Join(imageDescription.ImageInformation.Tags, ","),
				filesize,
				fileModTime,
			)
			if err != nil {
				app.SendHttpError(err, w)
				return
			}
		}

		fmt.Printf("Preparing response for file '%s' ...%s", fullPath, fmt.Sprintln())

		cleanJsonData, err := json.Marshal(&imageDescription)
		if err != nil {
			app.SendHttpError(err, w)
			return
		}

		w.WriteHeader(200)
		w.Write(cleanJsonData)
	}
}
