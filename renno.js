var RennoManager = require("./renno-manager.js");

function list_all(manager) {
    console.log("Available packages:");
    packages = manager.allPackages();
    for (var pkgname in packages) {
        if (!packages.hasOwnProperty(pkgname))
            continue;
        var pkg = packages[pkgname];
        console.log("    %s %s (%s %s %s)", pkg.name().padRight(15), pkg.description(),
        pkg.arches().join(","), pkg.platforms().join(","), pkg.boards().join(","));
    }

    console.log("");

    console.log("Available platforms:");
    platforms = manager.allPlatforms();
    for (var platname in platforms) {
        if (!platforms.hasOwnProperty(platname))
            continue;
        var platform = platforms[platname];
        console.log("    %s %s", platform.name().padRight(15), platform.description());
    }

    console.log("");

    console.log("Available projects:");
    projects = manager.allProjects();
    for (var projname in projects) {
        if (!projects.hasOwnProperty(projname))
            continue;
        var project = projects[projname];
        console.log("    %s %s", project.name().padRight(15), project.description());
    }

    console.log("");

    console.log("Available boards:");
    boards = manager.allBoards();
    for (var boardname in boards) {
        if (!boards.hasOwnProperty(boardname))
            continue;
        var board = boards[boardname];
        console.log("    %s %s", board.name().padRight(15), board.description());
    }

    console.log("");

    console.log("Available toolchains:");
    toolchains = manager.allToolchains();
    for (var toolchainname in toolchains) {
        if (!toolchains.hasOwnProperty(toolchainname))
            continue;
        var toolchain = toolchains[toolchainname];
        console.log("    %s %s  Supports: %s", toolchain.name().padRight(15), toolchain.description(), toolchain.archNames().join(", "));
    }

    console.log("");
}

function build_package(manager, args) {
    args.forEach(function(pkgName) {
        pkg = manager.getPackage(pkgName);
        pkg.build();
    });
}

function build_platform(manager, args) {
    args.forEach(function(platformName) {
        platform = manager.getPlatform(platformName);
        platform.build();
    });
}

function build_project(manager, args) {
    args.forEach(function(projectName) {
        project = manager.getProject(projectName);
        project.build();
    });
}
function print_help(manager) {
    console.log("Usage:");
    console.log("General arguments:");
    console.log("      --path   Add a directory to the search path");
    console.log("");
    console.log("Available subcommands:");
    console.log("        list   List known modules");
    console.log("    buildpkg   Build a package");
    console.log("   buildplat   Build a platform");
    console.log("       build   Build a project");
}

function run_renno(args) {
    var manager = new RennoManager();
    var residual = Array();

    var operation = print_help;

    for (var i = 0; i < args.length; i++) {
        var arg = args[i];
        if (arg == "--path") {
            manager.addPath(args[++i]);
        }

        else if (arg == "list")
            operation = list_all;

        else if (arg == "buildpkg")
            operation = build_package;

        else if (arg == "buildplat")
            operation = build_platform;

        else if ((arg == "build") || (arg == "buildproj"))
            operation = build_project;

        else
            residual.push(arg);
    }

    operation(manager, residual);
}

run_renno(process.argv.slice(2));
