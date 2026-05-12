from pathlib import Path

def test_synthetic_training_produces_valid_model(tmp_path: Path) -> None:
    """Training pipeline should produce a model with expected metadata."""
    from app.services.training import train_and_save_model
    
    test_model_path = tmp_path / "test_model.joblib"
    payload = train_and_save_model(model_path=test_model_path)
    
    assert payload["schema_version"] == 6
    assert payload["metrics"]["mae"] > 0
    assert test_model_path.exists()
