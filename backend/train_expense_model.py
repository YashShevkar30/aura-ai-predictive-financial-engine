from app.services.ml_model import train_and_save_model


if __name__ == "__main__":
    payload = train_and_save_model()
    print("Model trained and saved.")
    print(f"Trained at: {payload['trained_at']}")
