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

import React from "react";

interface ImageCardTagListProps {
  tags: string[];
  onTagClick: (tag: string) => void;
}

const ImageCardTagList: React.FC<ImageCardTagListProps> = ({
  tags,
  onTagClick,
}) => {
  const tagsList = [...tags];
  if (tagsList.length === 0) return null;

  return (
    <div
      className={`absolute bottom-2 left-2 flex flex-wrap gap-1 ${tags.length === 0 ? "hidden" : ""
        }`}
      style={{ zIndex: 10 }}
    >
      {tagsList.map((tag) => (
        <span
          key={tag}
          className="cursor-pointer px-2 py-0.5 text-xs rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-700 shadow"
          onClick={() => onTagClick(tag)}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

export default ImageCardTagList;
