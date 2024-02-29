package socket

import (
	"io"
	"log"
	"mime/multipart"
	"os"

	"github.com/google/uuid"
)

const MAX_UPLOAD_SIZE = 1024 * 1024 * 50 // 50 MB

func writeFile(f multipart.File) (string, error) {
	id := uuid.NewString()
	dst, err := os.Create("uploads/" + id)
	if err != nil {
		log.Println(err)
		return "", err
	}
	defer dst.Close()
	_, err = io.Copy(dst, f)
	if err != nil {
		log.Println(err)
		return "", err
	}
	return id, nil
}

func readFile(id string) (*os.File, error) {
	return os.Open("uploads/" + id)
}
