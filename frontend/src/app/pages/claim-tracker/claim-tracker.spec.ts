import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClaimTracker } from './claim-tracker';

describe('ClaimTracker', () => {
  let component: ClaimTracker;
  let fixture: ComponentFixture<ClaimTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClaimTracker],
    }).compileComponents();

    fixture = TestBed.createComponent(ClaimTracker);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
