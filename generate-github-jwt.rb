require 'openssl'
require 'jwt'  # https://rubygems.org/gems/jwt

# Need to run gem install jwt before running this script

# Private key contents
private_pem = File.read("/Users/Alex/ssh/review-corral/review-corral.2022-08-11.private-key.pem")
private_key = OpenSSL::PKey::RSA.new(private_pem)

# Generate the JWT
payload = {
  # issued at time, 60 seconds in the past to allow for clock drift
  iat: Time.now.to_i - 60,
  # JWT expiration time (10 minute maximum)
  exp: Time.now.to_i + (10 * 60),
  # GitHub App's identifier
  iss: "203068"
}

jwt = JWT.encode(payload, private_key, "RS256")
puts jwt