
if [ "$1" = "-m" ] && [ ! -z "$2" ]; then
    message="$2"
else
    message="changes not described by auther"
fi

git add .
git commit -m "$message"
git push origin main
vsce publish -p CwMLUostEW7MUg48PwpZAVHSKZ5C1CXQ3Y2o6tOYxDkifwnLxcB1JQQJ99AKACAAAAA
