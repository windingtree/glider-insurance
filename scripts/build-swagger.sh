#!/bin/bash

API_DOC_FOLDER="./public"
VERSIONS=( "v1" )

# Build docs for all API versions
for version in "${VERSIONS[@]}"
do
  echo "Building schema for API $version"
  rm -rf $API_DOC_FOLDER/$version
  mkdir -p $API_DOC_FOLDER/$version
  cp -r ./swagger/src/* $API_DOC_FOLDER/$version
  cp -r ./swagger/api/$version/* $API_DOC_FOLDER/$version
  API_DOC_URL=/api/doc/$version
  API_VERSION_URL=/api/$version
  API_DOC_URL_ESC=$(printf '%s\n' "$API_DOC_URL" | sed -e 's/[]\/$*.^[]/\\&/g')
  API_VERSION_URL_ESC=$(printf '%s\n' "$API_VERSION_URL" | sed -e 's/[]\/$*.^[]/\\&/g')
  sed -i "s/API_HOST_URL/$API_DOC_URL_ESC/g" $API_DOC_FOLDER/$version/index.html
  sed -i "s/API_VERSION_URL/$API_VERSION_URL_ESC/g" $API_DOC_FOLDER/$version/swagger.yaml
  npx js-yaml $API_DOC_FOLDER/$version/swagger.yaml > $API_DOC_FOLDER/$version/swagger.json
done

echo "Swagger schemas are built!"
exit 0
