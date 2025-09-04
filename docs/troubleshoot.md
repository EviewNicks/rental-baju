Checkout via the command line
If you do not want to use the merge button or an automatic merge cannot be performed, you can perform a manual merge on the command line. However, the following steps are not applicable if the base branch is protected.
URL

HTTPS

SSH

Patch
git@github.com:EviewNicks/rental-baju.git
Step 1 Clone the repository or update your local repository with the latest changes.

git pull origin main

Step 2 Switch to the head branch of the pull request.

git checkout develop

Step 3 Merge the base branch into the head branch.

git merge main

Step 4 Fix the conflicts and commit the result.

See Resolving a merge conflict using the command line for step-by-step instructions on resolving merge conflicts.
Step 5 Push the changes.

git push -u origin develop
