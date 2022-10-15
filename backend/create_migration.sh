#!/bin/sh

STAMP=$(date -u '+%Y%m%d%H%M%S')

touch "./supabase/migrations/${STAMP}_replace.sql"