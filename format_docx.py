docker-compose run --rm backend sh -c \
  "python manage.py flush --no-input && python manage.py seed_demo_data"
