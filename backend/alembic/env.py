from logging.config import fileConfig
import sys
import os

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context # type: ignore

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Add your project's backend directory to sys.path
# This allows alembic/env.py to import modules from your backend application
# Get the absolute path to the directory containing this env.py file (alembic directory)
current_alembic_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (which should be the 'backend' directory)
project_root_dir = os.path.dirname(current_alembic_dir)

# Add the project root (backend directory) to sys.path
# We use insert(0, ...) to ensure it's at the beginning of the path
if project_root_dir not in sys.path:
    sys.path.insert(0, project_root_dir)

# --- DEBUGGING STEP: Print sys.path to see what Python is looking at ---
# print(f"DEBUG: sys.path after modification: {sys.path}")
# --- END DEBUGGING STEP ---

# add your model's MetaData object here
# for 'autogenerate' support
# from myapp import mymodel
# target_metadata = mymodel.Base.metadata
# MODIFIED: Changed import to absolute import from 'backend.models'
from backend.models import Base


# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata

        )

        with context.begin_transaction():
            context.run_migrations()


target_metadata = Base.metadata # Ensure target_metadata is defined after Base import

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

