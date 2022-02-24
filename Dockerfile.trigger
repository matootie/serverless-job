# ============================================================= #
#  Trigger Dockerfile
#
#  This Dockerfile is for the trigger Lambda, which receives
#  SQS messages and runs ECS tasks.
# ============================================================= #

# Build image.
FROM node:14 as build
# Set the working directory.
WORKDIR /build
# Copy the repository contents.
COPY . .
# Bundle the trigger code into one single javascript file.
RUN npx esbuild --bundle --minify --outfile=dist/trigger/handler.js --platform=node --tree-shaking=true bin/trigger.ts

# Runtime image.
FROM --platform=amd64 public.ecr.aws/lambda/nodejs:14
# Copy the distributable javascript code from the build step.
COPY --from=build /build/dist/trigger/handler.js ${LAMBDA_TASK_ROOT}
# Set the entrypoint for the Lambda function.
CMD [ "handler.handler" ]
