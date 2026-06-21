import logging
import sys
from logging.handlers import RotatingFileHandler

class ExtraFormatter(logging.Formatter):
    STANDARD_ATTRS = {
        'name', 'msg', 'args', 'levelname', 'levelno', 'pathname', 'filename', 
        'module', 'exc_info', 'exc_text', 'stack_info', 'lineno', 'funcName', 
        'created', 'msecs', 'relativeCreated', 'thread', 'threadName', 
        'processName', 'process', 'message', 'asctime', 'taskName'
    }

    def format(self, record):
        s = super().format(record)
        extra_dict = {k: v for k, v in record.__dict__.items() if k not in self.STANDARD_ATTRS and not k.startswith('_')}
        if extra_dict:
            s += f" - {extra_dict}"
        return s

# Console handler (outputs to terminal)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(ExtraFormatter("%(asctime)s - %(levelname)s - %(message)s"))

# File handler (outputs to a file named app.log)
# Using RotatingFileHandler to prevent the file from growing infinitely.
# It limits the file size to 10MB (10*1024*1024 bytes) and keeps up to 5 backups.
file_handler = RotatingFileHandler(
    "app.log", maxBytes=10 * 1024 * 1024, backupCount=5
)
file_handler.setFormatter(ExtraFormatter("%(asctime)s - %(levelname)s - %(message)s"))

logging.basicConfig(
    level=logging.INFO,
    handlers=[console_handler, file_handler],
)
logger = logging.getLogger(__name__)
