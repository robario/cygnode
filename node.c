#undef UNICODE
#include <unistd.h>
#include <sys/cygwin.h>
#include <stdlib.h>
#include <stdio.h>
#include <windows.h>
#include <string.h>

char* readconf(char* line, size_t maxlen, FILE* stream) {
    if (fgets(line, maxlen, stream) == NULL) {
        return NULL;
    }
    char* p;
    p = strchr(line, '\r');
    if (p == NULL) {
        p = strchr(line, '\n');
    }
    if (p != NULL) {
        *p = '\0';
    }
    return line;
}

boolean isposix(const char* path) {
    return strncmp(path, "/", 1) == 0 ||
        strncmp(path, "~", 1) == 0 ||
        strncmp(path, "./", 2) == 0 ||
        strncmp(path, "../", 3) == 0;
}

int main(int argc, char* argv[]) {
    // read config
    const char* const confExt = ".conf";
    char execPath[MAX_PATH];
    GetModuleFileName(NULL, execPath, MAX_PATH - (strlen(confExt) + 1));
    char confPath[MAX_PATH];
    strncpy(confPath, execPath, strlen(execPath) + 1);
    strncat(confPath, confExt, strlen(confExt) + 1);
    FILE* fp = fopen(confPath, "r");
    if (fp == NULL) {
        fprintf(stderr, "%s not found\n", confPath);
        exit(EXIT_FAILURE);
    }
    char nodePath[MAX_PATH];
    readconf(nodePath, MAX_PATH, fp);
    char cygnodePath[MAX_PATH];
    readconf(cygnodePath, MAX_PATH, fp);
    fclose(fp);

    // prepare arguments
    char* args[argc + 2 + 1];
    args[0] = execPath;
    // cygnode
    args[1] = "--require";
    args[2] = cygnodePath;
    // convert to windows path for each argument
    for (int i = 1; i < argc; ++i) {
        if (isposix(argv[i])) {
            ssize_t size = cygwin_conv_path(CCP_POSIX_TO_WIN_A | CCP_RELATIVE, argv[i], NULL, 0);
            if (0 < size) {
                char* win = (char *)malloc(size);
                if (cygwin_conv_path(CCP_POSIX_TO_WIN_A | CCP_RELATIVE, argv[i], win, size) == 0) {
                    argv[i] = win;
                }
            }
        }
        args[i + 2] = argv[i];
    }
    args[argc + 2] = (char*)NULL;

    return execv(nodePath, args);
}
