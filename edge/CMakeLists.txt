cmake_minimum_required(VERSION 3.10)
project(roadsaathi_edge_pipeline CXX)

set(CMAKE_CXX_STANDARD 14)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Find OpenCV
find_package(OpenCV REQUIRED)
include_directories(${OpenCV_INCLUDE_DIRS})

# Optional RKNN C API
# set(RKNN_API_PATH "/usr/lib")
# find_library(RKNN_LIB rknn_api PATHS ${RKNN_API_PATH})

add_executable(rknn_pipeline rknn_pipeline.cpp)
target_link_libraries(rknn_pipeline ${OpenCV_LIBS} pthread)

message(STATUS "OpenCV library status: ${OpenCV_FOUND}")
message(STATUS "Target binary: rknn_pipeline")
