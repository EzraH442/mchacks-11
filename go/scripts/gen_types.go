package main

import "github.com/gzuidhof/tygo/tygo"

func main() {
	config := &tygo.Config{
		Packages: []*tygo.PackageConfig{
			{
				Path:         "socket",
				IncludeFiles: []string{"master_messages.go", "master_handlers.go", "message.go"},
				TypeMappings: map[string]string{
					"interface{}": "any /* hyperparameters */",
				},
				FallbackType: "any",
				OutputPath:   "../distributed-hyperparameter-optimization/auto-generated",
			},
		},
	}

	gen := tygo.New(config)
	if err := gen.Generate(); err != nil {
		print(err.Error())
	}
}
