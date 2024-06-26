#!/bin/bash

# This testing script generates a JWT for use with the Review Corral API. It should NOT
# be used in production as it's expiry is only 10 minutes (the max allowed).

# Path to the private key
# Test App
PRIVATE_KEY_PATH="/Users/alex/ssh/review-corral/test-review-corral.2023-12-30.private-key.pem"

# Prod App
PRIVATE_KEY_PATH="/Users/Alex/ssh/review-corral/review-corral.2022-08-11.private-key.pem"

# Generate payload with `iat`, `exp`, and `iss`
iat=$(date +%s)
let "exp = iat + 600"  # 10 minutes from now
iss="203068"

# Create the JWT Header
header=$(echo -n '{"alg":"RS256","typ":"JWT"}' | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')

# Create the JWT Payload
payload=$(echo -n "{\"iat\":$iat,\"exp\":$exp,\"iss\":\"$iss\"}" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')

# Create the Signature
signature=$(echo -n "$header.$payload" | openssl dgst -sha256 -sign "$PRIVATE_KEY_PATH" | openssl base64 -e -A | tr '+/' '-_' | tr -d '=')

# Combine to form the final JWT
jwt="$header.$payload.$signature"
echo $jwt
