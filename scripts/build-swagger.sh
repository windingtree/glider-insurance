#!/usr/bin/env bash

API_DOC_FOLDER="./public/api"
VERSIONS=( "v1" )

rm -rf API_DOC_FOLDER
mkdir -p $API_DOC_FOLDER

# Build docs for all API versions
for version in "${VERSIONS[@]}"
do
  echo "Building schema for API $version"
  mkdir -p $API_DOC_FOLDER/doc/$version
  cp -r ./swagger/src/* "$API_DOC_FOLDER/doc/$version"
  cp -r ./swagger/api/$version/* "$API_DOC_FOLDER/doc/$version"

  API_DOC_URL_ESC=$(printf '%s\n' "/api/doc/$version" | sed -e 's/[]\/$*.^[]/\\&/g')
  API_VERSION_URL_ESC=$(printf '%s\n' "/api/$version" | sed -e 's/[]\/$*.^[]/\\&/g')
  sed -i "s/API_HOST_URL/$API_DOC_URL_ESC/g" $API_DOC_FOLDER/doc/$version/index.html
  sed -i "s/API_VERSION_URL/$API_VERSION_URL_ESC/g" $API_DOC_FOLDER/doc/$version/swagger.yaml

  npx js-yaml $API_DOC_FOLDER/doc/$version/swagger.yaml > $API_DOC_FOLDER/doc/$version/swagger.json
  rm -rf $API_DOC_FOLDER/doc/$version/swagger.yaml
done

echo "Swagger schemas are built and Swagger UI is ready!"
exit 0
