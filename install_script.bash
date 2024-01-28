#!/bin/bash

git clone https://github.com/EzraH442/mchacks-11.git

cd mchacks-11

pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "Installation completed successfully."
else
    echo "Error: Pip installation failed."
fi
